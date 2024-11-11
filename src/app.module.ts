import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [ScheduleModule.forRoot(), ConfigModule.forRoot()],
	controllers: [],
	providers: [AppService],
})
export class AppModule {}
