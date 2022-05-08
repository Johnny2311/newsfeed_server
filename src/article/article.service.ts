import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { Article, ArticleDocument } from "./schemas/article.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { lastValueFrom } from "rxjs";

@Injectable()
export class ArticleService {
  constructor(@InjectModel(Article.name) private articleModel: Model<ArticleDocument>, private httpService: HttpService) {}

  async findAll(): Promise<Article[]> {
    return await this.articleModel
      .find({ is_deleted: false })
      .exec();
  }

  async remove(id: string): Promise<Article> {
    // soft delete
    return await this.articleModel
      .findOneAndUpdate({ _id: id }, { is_deleted: true })
      .exec();
  }

  async fetch(): Promise<Article[]> {
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
        return await this.articleModel.insertMany(newArticles);
      }

      return [];
    } catch (e) {
      throw new InternalServerErrorException(e)
    }
  }
}
