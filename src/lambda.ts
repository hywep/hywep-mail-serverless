import { handleDynamoDBStreamEvent } from './dynamo/service';
import { handleScheduledEvent } from './schedule/service';

const eventHandlers: Record<string, (event: any) => Promise<void>> = {
  'aws.dynamodb': handleDynamoDBStreamEvent,
  'aws.scheduled': handleScheduledEvent,
};

export const handler = async (event: any): Promise<void> => {
  const eventSource = determineEventSource(event);
  const handlerFunction = eventHandlers[eventSource];

  if (!handlerFunction) {
    console.error(`No handler found for event source: ${eventSource}`);
    return;
  }

  try {
    console.log(`Routing event to handler for source: ${eventSource}`);
    await handlerFunction(event);
  } catch (error) {
    console.error(`Error handling event from source: ${eventSource}`, error);
  }
};

function determineEventSource(event: any): string {
  if (event.Records?.[0]?.eventSource === 'aws:dynamodb') return 'aws.dynamodb';
  if (event.source === 'hywep.recruit.tag') return 'aws.scheduled';
  return 'unknown';
}
