import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { TaskSearchResult } from '../tasks/interfaces/taskSearchResponse.interface';
import { TaskSearchBody } from '../tasks/interfaces/taskSearchBody.interface';
import { Task } from '../tasks/task.entity';
import { ConfigService } from '@nestjs/config';
@Injectable()
export default class SearchService {

  constructor(
    private readonly configService: ConfigService,
    private readonly elasticsearchService: ElasticsearchService
  ) {}

  index = this.configService.get('ELASTICSEARCH_INDEX');

  createIndex() {
    throw new Error("Method not implemented.");
  }
  
 
  async indexPost(task: Task) {
    return this.elasticsearchService.index<TaskSearchResult, TaskSearchBody>({
      index: this.index,
      body: {
        id: task.id,
        title: task.title,
        description: task.description
      }
    })
  }
 
  async search(text: string) {
    const { body } = await this.elasticsearchService.search<TaskSearchResult>({
      index: this.index,
      body: {
        query: {
          multi_match: {
            query: text,
            fields: ['title', 'description']
          }
        }
      }
    })

    const hits = body.hits.hits;
    
    return hits.map((item) => item._source);
  }
}