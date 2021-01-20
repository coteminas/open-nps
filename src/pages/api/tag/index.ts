import { NextApiRequest, NextApiResponse } from 'next';
import { MongooseQueryParser } from 'mongoose-query-parser';

import Tag, { ITag } from '~/model/Tag';
import { createApiHandler } from '~/util/api';
import { authMiddleware, RoleEnum } from '~/util/authMiddleware';

const parser = new MongooseQueryParser();

export const findTags = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const { filter, ...opts } = parser.parse(req.query);
  const tags = await Tag.find(filter, opts);
  return res.json({ tags });
};

export const createTag = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const tag: ITag = await Tag.create(req.body);
  return res.json(tag);
};

export default createApiHandler({
  GET: authMiddleware([RoleEnum.TAG_READ], findTags),
  POST: authMiddleware([RoleEnum.TAG_WRITE], createTag),
});