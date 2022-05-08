import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ArticleDocument = Article & Document;

@Schema()
export class Article {
  @Prop({ type: String })
  title: string;

  @Prop({ type: String })
  url: string;

  @Prop({ type: String })
  author: string;

  @Prop({ type: Number })
  story_id: number;

  @Prop({ type: String })
  story_title: string;

  @Prop({ type: String })
  story_url: string;

  @Prop({ type: String })
  created_at: string;

  @Prop({ type: Number })
  created_at_i: number;

  @Prop({ type: Boolean, default: false })
  is_deleted?: boolean;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);