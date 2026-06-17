import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspressoController } from './espresso.controller';
import { EspressoService } from './espresso.service';
import { EspressoBean } from './entities/espresso-bean.entity';
import { EspressoRawEntry } from './entities/espresso-raw-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EspressoBean, EspressoRawEntry])],
  controllers: [EspressoController],
  providers: [EspressoService],
  exports: [EspressoService],
})
export class EspressoModule {}
