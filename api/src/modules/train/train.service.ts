import { Injectable } from '@nestjs/common';
import { CreateTrainDto } from './dto/create-train.dto';
import { UpdateTrainDto } from './dto/update-train.dto';

@Injectable()
export class TrainService {
  create(createTrainDto: CreateTrainDto) {
    return 'This action adds a new train';
  }

  findAll() {
    return `This action returns all train`;
  }

  findOne(id: number) {
    return `This action returns a #${id} train`;
  }

  update(id: number, updateTrainDto: UpdateTrainDto) {
    return `This action updates a #${id} train`;
  }

  remove(id: number) {
    return `This action removes a #${id} train`;
  }
}
