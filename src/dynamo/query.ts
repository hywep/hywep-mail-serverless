import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DYNAMO_TABLE } from './table';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamodb = new DynamoDBClient({ region: 'ap-northeast-2' });

export async function getAllUsers(): Promise<any[]> {
  const allUsers: any[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined = undefined;

  while (true) {
    const response = await dynamodb.send(
      new ScanCommand({
        TableName: DYNAMO_TABLE.USERS,
        ExclusiveStartKey: lastEvaluatedKey,
        FilterExpression: '#isActive = :trueValue',
        ExpressionAttributeNames: {
          '#isActive': 'isActive',
        },
        ExpressionAttributeValues: {
          ':trueValue': { BOOL: true },
        },
      }),
    );

    if (response.Items) {
      allUsers.push(...response.Items.map((item) => unmarshall(item)));
    }

    if (!response.LastEvaluatedKey) {
      break;
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  }

  return allUsers;
}
