import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from './app.service';

@Module({
	imports: [ScheduleModule.forRoot()],
	controllers: [],
	providers: [AppService],
})
export class AppModule {}
