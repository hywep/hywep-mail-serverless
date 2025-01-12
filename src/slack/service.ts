import { SLACK_TYPE } from './constant';

export async function sendSlackMessage(type: SLACK_TYPE, message: string) {
  const payload = { text: message };

  let webhookUrl: string | URL | Request;

  if (type === SLACK_TYPE.SEND_EMAIL) {
    webhookUrl = process.env.SLACK_EMAIL_WEBHOOK;
  } else if (type === SLACK_TYPE.NEW_RECRUIT) {
    webhookUrl = process.env.SLACK_NEW_RECRUIT_WEBHOOK;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Slack API error:', errorData);
      return;
    }

    console.log('Slack message sent successfully');
  } catch (error) {
    console.error('Error sending Slack message:', error);
  }
}
