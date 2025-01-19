import { DynamoDBStreamEvent } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import {
  findMatchingActiveUsers,
  findMatchingRecruits,
} from '../opensearch/query';
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
      `[${process.env.NODE_ENV}] 진행 공고 이메일 전송 완료:\n- 이름: ${name}\n- 이메일: ${email}\n`,
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
    organizationSupportAmount,
  } = newItem;

  await sendSlackMessage(
    SLACK_TYPE.NEW_RECRUIT,
    `[${process.env.NODE_ENV}] 신규 공고:\n- 기관: ${organizationName}\n- 공고상 전공: ${qualifications?.major}\n- 전공: ${majors}\n`,
  );

  const matchingUsers = await findMatchingActiveUsers(majors, selectionInfo);

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
      organizationSupportAmount,
    );
    await sendEmail(
      email,
      `${
        process.env.NODE_ENV !== 'prod' ? `[${process.env.NODE_ENV}] ` : ''
      }[한양대학교 현장실습] 새로운 공고를 확인해보세요`,
      html,
    );
  }
  await sendSlackMessage(
    SLACK_TYPE.SEND_EMAIL,
    `[${process.env.NODE_ENV}] 신규 공고 이메일 전송 완료:\n- 기관: ${organizationName}\n- 발송 건수: ${matchingUsers.length}\n`,
  );
}
