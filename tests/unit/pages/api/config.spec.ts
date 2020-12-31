jest.mock('../../../../src/model/Config');

import merge from 'lodash.merge';
import { NextApiResponse, NextApiRequest } from 'next';

import Config from '~/model/Config';

import { findConfigs, createConfig } from '~/pages/api/config';
import { findConfig, updateConfig } from '~/pages/api/config/[id]';

describe('/pages/api/config', () => {
  let req = {} as NextApiRequest;
  const res = {} as NextApiResponse;

  beforeEach(() => {
    req = {} as NextApiRequest;
    res.json = jest.fn();
    res.status = jest.fn().mockReturnValue(res);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('index', () => {
    it('findConfigs', async () => {
      const fakeConfigs = [1, 2];
      (Config.find as jest.Mock).mockResolvedValue(fakeConfigs);

      await findConfigs(req, res);

      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ configs: fakeConfigs });
    });

    it('createConfig', async () => {
      req.body = { key: 'mui', alias: 'foo', values: { a: 1 } };
      const fakeId = '123';
      const fakeConfig = { _id: fakeId, ...req.body };

      (Config.create as jest.Mock).mockResolvedValue(fakeConfig);

      await createConfig(req, res);

      expect(Config.create).toHaveBeenCalledTimes(1);
      expect(Config.create).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(fakeConfig);
    });
  });

  describe('[id]', () => {
    it('findConfig', async () => {
      const fakeConfig = { a: 1 };
      req.query = { id: 'foo' };
      (Config.findOne as jest.Mock).mockResolvedValue(fakeConfig);

      await findConfig(req, res);

      expect(Config.findOne).toHaveBeenCalledTimes(1);
      expect(Config.findOne).toHaveBeenCalledWith({ _id: req.query.id });
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(fakeConfig);
    });

    it('should updateConfig correctly', async () => {
      const fakeConfig = { values: { y: 2 }, updateOne: jest.fn() };
      req.query = { id: 'foo' };
      req.body = { alias: 'bar', values: { x: 1 } };
      (Config.findOne as jest.Mock).mockResolvedValue(fakeConfig);

      await updateConfig(req, res);

      expect(Config.findOne).toHaveBeenCalledTimes(1);
      expect(Config.findOne).toHaveBeenCalledWith({ _id: req.query.id });
      expect(fakeConfig.updateOne).toHaveBeenCalledTimes(1);
      expect(fakeConfig.updateOne).toHaveBeenCalledWith({
        alias: req.body.alias,
        values: merge(fakeConfig.values, req.body.values),
      });
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(fakeConfig);
    });

    it('should updateConfig throw 500 error', async () => {
      const fakeConfig = { values: { y: 2 }, updateOne: jest.fn() };
      req.query = { id: 'foo' };
      req.body = { key: 'foo' };
      (Config.findOne as jest.Mock).mockResolvedValue(fakeConfig);

      await updateConfig(req, res);

      expect(Config.findOne).not.toHaveBeenCalledTimes(1);
      expect(Config.findOne).not.toHaveBeenCalledWith({ _id: req.query.id });
      expect(fakeConfig.updateOne).not.toHaveBeenCalledTimes(1);
      expect(fakeConfig.updateOne).not.toHaveBeenCalledWith({
        alias: req.body.alias,
        values: merge(fakeConfig.values, req.body.values),
      });

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid field to change: <key>',
      });
    });
  });
});