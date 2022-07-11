import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticleModule } from './article/article.module';
import { MongooseModule} from '@nestjs/mongoose';

@Module({
  imports: [ArticleModule, MongooseModule.forRoot(`mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@mongo:27017/`)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
