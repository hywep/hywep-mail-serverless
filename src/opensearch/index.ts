const addPrefix = (name: string) => `${name}-${process.env.NODE_ENV || 'dev'}`;

export const OPENSEARCH_INDEX = Object.freeze({
  RECRUIT: addPrefix('recruit'),
  USERS: addPrefix('users'),
});
