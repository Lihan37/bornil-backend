import { ObjectId } from 'mongodb';
import { AppError } from './AppError';

export function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid id');
  }
  return new ObjectId(id);
}
