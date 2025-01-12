const addPrefix = (name: string) => `${name}-${process.env.NODE_ENV || 'dev'}`;

export const DYNAMO_TABLE = Object.freeze({
  RECRUIT: addPrefix('hywep-recruit'),
  USERS: addPrefix('hywep-users'),
});
