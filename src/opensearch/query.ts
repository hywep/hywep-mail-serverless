import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { OPENSEARCH_INDEX } from './index';

const openSearchClient = new OpenSearchClient({
  node: process.env.OPENSEARCH_ENDPOINT,
  auth: {
    username: process.env.OPENSEARCH_USERNAME,
    password: process.env.OPENSEARCH_PASSWORD,
  },
});

export async function searchMatchingRecruits(
  searchKeywords: string[],
): Promise<any[]> {
  const today = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
  )
    .toISOString()
    .split('T')[0];

  const query = {
    bool: {
      should: searchKeywords.flatMap((keyword) => [
        { wildcard: { 'internshipDetails.jobOverview': `*${keyword}*` } },
        { wildcard: { 'internshipDetails.goals': `*${keyword}*` } },
        { wildcard: { 'internshipDetails.jobTitle': `*${keyword}*` } },
        { wildcard: { 'internshipDetails.operationGuidance': `*${keyword}*` } },
        { wildcard: { 'internshipDetails.targetOutcomes': `*${keyword}*` } },
        { wildcard: { 'qualifications.competence': `*${keyword}*` } },
        { wildcard: { 'qualifications.etc': `*${keyword}*` } },
        { wildcard: { organizationDescription: `*${keyword}*` } },
      ]),
      minimum_should_match: 1,
      filter: [
        {
          range: {
            applicationDeadline: {
              gte: today,
            },
          },
        },
      ],
    },
  };

  try {
    const response = await openSearchClient.search({
      index: OPENSEARCH_INDEX.RECRUIT,
      body: {
        query,
        sort: [{ applicationDeadline: { order: 'asc' } }],
      },
      size: 1000,
    });

    const uniqueResults = new Map<string, any>();
    response.body.hits.hits.forEach((hit: any) => {
      if (!uniqueResults.has(hit._id)) {
        uniqueResults.set(hit._id, hit._source);
      }
    });

    return Array.from(uniqueResults.values());
  } catch (error) {
    console.error('Error executing OpenSearch query:', error);
    throw error;
  }
}

export async function findMatchingRecruits(
  userMajors: string[],
  userGrade: number,
): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];

  const majorShouldQueries = userMajors.map((major) => ({
    match: { majors: major },
  }));

  majorShouldQueries.push({ match: { majors: '무관' } });

  const query = {
    bool: {
      must: [
        { bool: { should: majorShouldQueries } },
        { match: { selectionInfo: userGrade.toString() } },
        { range: { applicationDeadline: { gte: today } } },
      ],
    },
  };

  const response = await openSearchClient.search({
    index: OPENSEARCH_INDEX.RECRUIT,
    body: {
      query,
      sort: [{ applicationDeadline: { order: 'asc' } }],
    },
    size: 1000,
  });

  return response.body.hits.hits.map((hit: any) => hit._source);
}

export async function findMatchingUsers(
  recruitMajors: string[],
  recruitGrades: number[],
): Promise<any[]> {
  const majorShouldQueries = recruitMajors.map((major) => ({
    match: { majors: major },
  }));

  const gradeShouldQueries = recruitGrades.map((grade) => ({
    match: { grade: grade },
  }));

  let mustQueries: any[];

  if (recruitMajors.includes('무관')) {
    mustQueries = [{ bool: { should: gradeShouldQueries } }];
  } else {
    mustQueries = [
      { bool: { should: majorShouldQueries } },
      { bool: { should: gradeShouldQueries } },
    ];
  }

  const query = {
    bool: {
      must: mustQueries,
      filter: [{ term: { isActive: true } }],
    },
  };

  const response = await openSearchClient.search({
    index: OPENSEARCH_INDEX.USERS,
    body: {
      query,
    },
    size: 1000,
  });

  return response.body.hits.hits.map((hit: any) => hit._source);
}
