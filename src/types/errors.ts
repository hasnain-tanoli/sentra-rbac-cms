import mongoose from 'mongoose';

export interface MongoError extends Error {
  code?: number;
  writeErrors?: Array<{ err: { code: number } }>;
  insertedDocs?: mongoose.Document[];
}

export function isMongoError(error: unknown): error is MongoError {
  return error instanceof Error && 'code' in error;
}

export function isDuplicateKeyError(error: unknown): boolean {
  return isMongoError(error) && error.code === 11000;
}