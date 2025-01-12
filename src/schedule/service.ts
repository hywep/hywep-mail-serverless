import { getAllUsers } from '../dynamo/query';
import { searchMatchingRecruits } from '../opensearch/query';
import { sendRecruitmentByTagEmail } from '../mail/service';
import { sendSlackMessage } from '../slack/service';
import { SLACK_TYPE } from '../slack/constant';

export async function handleScheduledEvent(event: any): Promise<void> {
  const { source } = event;

  if (source !== 'hywep.recruit.tag') {
    console.warn(`Unhandled scheduled event source: ${source}`);
    return;
  }

  try {
    console.log('Processing scheduled event:', JSON.stringify(event, null, 2));
    const users = await getAllUsers();

    for (const user of users) {
      const { email, name, tags } = user;
      if (!email || !name || !tags || tags.length === 0) {
        console.warn(
          `Skipping user with incomplete data: ${JSON.stringify(user)}`,
        );
        continue;
      }

      const matchingRecruits = await searchMatchingRecruits(tags);

      if (matchingRecruits.length > 0) {
        await sendRecruitmentByTagEmail(email, name, matchingRecruits);
        await sendSlackMessage(SLACK_TYPE.SEND_EMAIL, `Email sent to ${email}`);
      } else {
        console.log(`No matches for user: ${email}`);
      }
    }
  } catch (error) {
    console.error('Error processing scheduled event:', error);
  }
}
