import { TensorflowService } from '@/core/tensorflow/tensorflow.service'
import { Module } from '@nestjs/common'

@Module({
  providers: [TensorflowService],
  exports: [TensorflowService]
})
export class TensorflowModule {}
