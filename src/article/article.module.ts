import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from "@nestjs/mongoose";
import { Article, ArticleSchema } from "./schemas/article.schema";

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{
      name: Article.name,
      schema: ArticleSchema,
    }
    ])],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
