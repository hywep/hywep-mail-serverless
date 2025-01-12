import { DynamoDBStreamEvent } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { findMatchingRecruits, findMatchingUsers } from '../opensearch/query';
import {
  generateInternshipEmailHTML,
  sendEmail,
  sendNewRecruitmentEmail,
} from '../mail/service';
import { sendSlackMessage } from '../slack/service';
import { SLACK_TYPE } from '../slack/constant';

export async function handleDynamoDBStreamEvent(
  event: DynamoDBStreamEvent,
): Promise<void> {
  for (const record of event.Records) {
    try {
      if (record.eventName === 'INSERT' && record.dynamodb?.NewImage) {
        const newItem = unmarshall(
          record.dynamodb.NewImage as Record<string, AttributeValue>,
        );
        const eventSourceARN = record.eventSourceARN!;

        if (eventSourceARN.includes('hywep-users')) {
          await handleHywepUsers(newItem);
        } else if (eventSourceARN.includes('hywep-recruit')) {
          await handleHywepRecruit(newItem);
        } else {
          console.warn(`Unrecognized ARN: ${eventSourceARN}`);
        }
      }
    } catch (error) {
      console.error('Error processing DynamoDB record:', error);
    }
  }
}

export async function handleHywepUsers(newItem: any): Promise<void> {
  const { majors, grade, email, name } = newItem;
  if (!majors || !grade || !email || !name) return;

  const matchingRecruits = await findMatchingRecruits(majors, grade);
  if (matchingRecruits.length > 0) {
    await sendNewRecruitmentEmail(email, name, matchingRecruits);
    await sendSlackMessage(
      SLACK_TYPE.SEND_EMAIL,
      `Recruit email sent to ${email}`,
    );
  }
}

export async function handleHywepRecruit(newItem: any): Promise<void> {
  const {
    majors,
    selectionInfo,
    organizationName,
    location,
    applicationDeadline,
    department,
    startDate,
    endDate,
    type,
    recruitCount,
    organizationSize,
    qualifications,
    interviewInfo,
    internshipDetails,
    announcedMajors,
  } = newItem;

  await sendSlackMessage(
    SLACK_TYPE.NEW_RECRUIT,
    `New recruit: ${organizationName}`,
  );
  const matchingUsers = await findMatchingUsers(majors, selectionInfo);

  for (const { name, email } of matchingUsers) {
    const html = generateInternshipEmailHTML(
      name,
      organizationName,
      location,
      applicationDeadline,
      department,
      startDate,
      endDate,
      type,
      recruitCount,
      organizationSize,
      qualifications,
      interviewInfo,
      internshipDetails,
      announcedMajors,
    );
    await sendEmail(email, `New recruit: ${organizationName}`, html);
  }
}
