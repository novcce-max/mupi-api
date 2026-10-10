import { CaseMaterialService } from './case-material.service';

describe('CaseMaterialService helpers', () => {
  it('normalizeIds via setMaterialsForCase filters invalid and duplicates', async () => {
    const linkRepo = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((row) => row),
      save: jest.fn(async (rows) => rows),
    };
    const caseRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    const materialRepo = {
      find: jest.fn().mockResolvedValue([{ id: '11' }, { id: '22' }]),
      findOne: jest.fn(),
    };

    const service = new CaseMaterialService(
      linkRepo as never,
      caseRepo as never,
      materialRepo as never,
    );

    const saved = await service.setMaterialsForCase('99', [
      '11',
      '11',
      '22',
      '999',
      '',
      null,
    ]);

    expect(saved).toEqual(['11', '22']);
    expect(linkRepo.delete).toHaveBeenCalledWith({ caseId: '99' });
    expect(linkRepo.save).toHaveBeenCalledWith([
      { caseId: '99', materialId: '11', sortOrder: 0 },
      { caseId: '99', materialId: '22', sortOrder: 1 },
    ]);
  });

  it('clears links when empty materialIds provided', async () => {
    const linkRepo = {
      find: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn(),
      save: jest.fn(),
    };
    const service = new CaseMaterialService(
      linkRepo as never,
      { find: jest.fn(), findOne: jest.fn() } as never,
      { find: jest.fn(), findOne: jest.fn() } as never,
    );

    const saved = await service.setMaterialsForCase('7', []);
    expect(saved).toEqual([]);
    expect(linkRepo.delete).toHaveBeenCalledWith({ caseId: '7' });
    expect(linkRepo.save).not.toHaveBeenCalled();
  });
});
