import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { Article, ArticleDocument } from "./schemas/article.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { lastValueFrom } from "rxjs";
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name)

  constructor(@InjectModel(Article.name) private articleModel: Model<ArticleDocument>, private httpService: HttpService) {}

  async findAll(page = 1, size = 10): Promise<any> {

    if (page <= 0 || size <= 0)
      throw new HttpException('Pagination error', HttpStatus.BAD_REQUEST);

    if (size > 100)
      size = 100;

    const count = await this.articleModel.count({ is_deleted: false });

    const amountToSkip: number = (page - 1) * size;
    const articles = await this.articleModel
      .find({ is_deleted: false })
      .sort({ created_at_i: -1 })
      .skip(amountToSkip)
      .limit(size)
      .exec();

    return {
      count,
      articles
    }
  }

  async remove(id: string): Promise<Article> {
    // soft delete
    return await this.articleModel
      .findByIdAndUpdate(id, { is_deleted: true }, {new: true})
      .exec();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async fetch(): Promise<Article[]> {
    this.logger.debug('Fetching data from API...')
    try {
      const url = 'https://hn.algolia.com/api/v1/search_by_date?query=nodejs';
      const source = this.httpService.get(url);
      const res = await lastValueFrom(source);
      let newArticles: Article[] = res.data && res.data['hits'];

      newArticles = newArticles.map(
        (cur) => {
          if (!cur.title)
            cur.title = cur.story_title;

          if (!cur.url)
            cur.url = cur.story_url;

          return cur;
        }
      )

      const lastArr = await this.articleModel
        .find({})
        .sort({ created_at_i: -1 })
        .limit(1)
        .exec();

      const last = lastArr.pop();

      // only get new and valid articles
      newArticles = newArticles.filter(
        (cur) => {
          if (!cur.title && !cur.story_title)
            return false;

          if (!cur.url && !cur.story_url)
            return false;

          // skip older than `last`
          if (last && cur.created_at_i <= last.created_at_i)
            return false;

          return true;
        },
      );

      if (newArticles.length > 0) {
        this.logger.debug(`Saved ${newArticles.length} new articles`)
        return await this.articleModel.insertMany(newArticles);
      }

      this.logger.debug(`No new articles`)
      return [];
    } catch (e) {
      throw new InternalServerErrorException(e)
    }
  }
}
