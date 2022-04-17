import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Article } from './entities/article.entity';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ArticleService {
  private readonly articles: Article[] = [];

  constructor(private httpService: HttpService) {}

  private getCurrent() {
    return this.articles.filter((x) => !x.is_deleted);
  }

  findAll() {
    return this.getCurrent();
  }

  remove(id: number) {
    const curArticles = this.getCurrent();
    if (id < curArticles.length) {
      const idx = this.articles.indexOf(curArticles[id]);
      this.articles[idx]['is_deleted'] = true;
    }
  }

  async fetch(): Promise<Article[]> {
    let newArticles: Article[] = [];
    try {
      const url = 'https://hn.algolia.com/api/v1/search_by_date?query=nodejs';
      const source = this.httpService.get(url);
      const res = await lastValueFrom(source);
      newArticles = res.data && res.data['hits'];

      // get the newest article stored
      const last = this.articles.reduce(
        (x, y) => (x.created_at_i > y.created_at_i ? x : y),
        { created_at_i: 0 },
      );

      // only get the new articles
      newArticles = newArticles.filter(
        (x) => x.created_at_i > last.created_at_i,
      );

      // removing unnecessary fields
      newArticles = newArticles.map(
        ({
          title,
          url,
          author,
          story_id,
          story_title,
          story_url,
          created_at,
          created_at_i,
        }) => ({
          title,
          url,
          author,
          story_id,
          story_title,
          story_url,
          created_at,
          created_at_i,
        }),
      );
    } catch (e) {
      console.error(e);
    }
    this.articles.push(...newArticles);
    return newArticles;
  }
}
