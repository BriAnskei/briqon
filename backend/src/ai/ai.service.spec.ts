import { Test } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ScheduleSchema } from './schemas/schedule.schema';
import { OllamaService } from '../ollama/ollama.service';

describe('AiService', () => {
  let service: AiService;
  let ollamaService: jest.Mocked<OllamaService>;

  beforeEach(async () => {
    // remove logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: OllamaService,
          useValue: {
            generateStreamResponse: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    ollamaService = module.get(OllamaService);
  });

  // restore logs
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('generateScheduleJson', () => {
    it('should return valid schedule json', async () => {
      const validJson = `
    [
      {
        "start_time": "09:00",
        "end_time": "10:00",
        "activity": "Breakfast"
      }
    ]
    `;

      ollamaService.generateStreamResponse.mockResolvedValue(
        mockStream([validJson]) as any,
      );

      const res = await service.generateScheduleJson('test prompt');

      expect(res).toEqual([
        {
          start_time: '09:00',
          end_time: '10:00',
          activity: 'Breakfast',
        },
      ]);
    });

    it('should retry when json format is invalid', async () => {
      const invalidJson = `invalid json`;

      const validJson = `
    [
      {
        "start_time": "09:00",
        "end_time": "10:00",
        "activity": "Breakfast"
      }
    ]
    `;

      ollamaService.generateStreamResponse
        .mockResolvedValueOnce(mockStream([invalidJson]) as any)
        .mockResolvedValueOnce(mockStream([validJson]) as any);

      const result = await service.generateScheduleJson('test prompt');

      expect(ollamaService.generateStreamResponse).toHaveBeenCalledTimes(2);

      expect(result[0].activity).toBe('Breakfast');
    });

    it('should trhow an error after max retries', async () => {
      const invalidJson = 'invalidJson';

      ollamaService.generateStreamResponse.mockResolvedValueOnce(
        mockStream([invalidJson]) as any,
      );

      await expect(service.generateScheduleJson('test')).rejects.toThrow(
        'Failed to generate a valid schedule json format',
      );

      expect(ollamaService.generateStreamResponse).toHaveBeenCalledTimes(3);
    });
  });
});

// helper mock stream generator
async function* mockStream(chunks: string[]) {
  for (const chunk of chunks) {
    yield {
      message: { content: chunk },
    };
  }
}
