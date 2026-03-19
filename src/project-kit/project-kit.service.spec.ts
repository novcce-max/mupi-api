import { InternalServerErrorException } from '@nestjs/common';

import { ProjectKitService } from './project-kit.service';
import { ProjectKit } from './entities/project-kit.entity';

type MockRepo<T> = {
  create: jest.Mock;
  save: jest.Mock;
};

function createMockRepo<T>(): MockRepo<T> {
  return {
    create: jest.fn(),
    save: jest.fn(),
  };
}

describe('ProjectKitService', () => {
  let service: ProjectKitService;
  let repo: MockRepo<ProjectKit>;

  const basePayload = {
    name: '测试项目包',
    materials: [],
    cases: [],
    problems: [],
  };

  beforeEach(() => {
    repo = createMockRepo<ProjectKit>();
    service = new ProjectKitService(repo as unknown as any);
  });

  it('should retry create when unique constraint violation occurs and succeed on second attempt', async () => {
    repo.create.mockImplementation((data) => data);

    repo.save
      .mockRejectedValueOnce({ code: '23505' })
      .mockResolvedValueOnce({ id: '1', shareId: 'share-1' });

    const result = await service.create(basePayload, 'member-1');

    expect(result).toEqual({ id: '1', shareId: 'share-1' });
    expect(repo.save).toHaveBeenCalledTimes(2);
    expect(repo.create).toHaveBeenCalledTimes(2);
  });

  it('should throw InternalServerErrorException after exhausting max attempts on unique constraint violation', async () => {
    repo.create.mockImplementation((data) => data);

    repo.save.mockRejectedValue({ code: '23505' });

    await expect(
      service.create(basePayload, 'member-1'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(repo.save).toHaveBeenCalledTimes(3);
  });
});
