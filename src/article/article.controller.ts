import { Controller, Get, Param, Delete, Query } from "@nestjs/common";
import { ArticleService } from './article.service';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  findAll(@Query('page') page: number, @Query('size') size: number) {
    return this.articleService.findAll(page, size);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articleService.remove(id);
  }

  @Get('external')
  fetch() {
    return this.articleService.fetch();
  }
}
