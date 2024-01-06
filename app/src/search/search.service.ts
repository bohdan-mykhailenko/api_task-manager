import { Injectable } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { TaskSearchResult } from "../tasks/interfaces/taskSearchResponse.interface";
import { TaskSearchBody } from "../tasks/interfaces/taskSearchBody.interface";
import { Task } from "../tasks/task.entity";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export default class SearchService {
  constructor(
    private readonly configService: ConfigService,
    private readonly elasticsearchService: ElasticsearchService
  ) {}

  private index = this.configService.get("ELASTICSEARCH_INDEX");
  private mappingsPath = path.join(__dirname, "mappings.json");

  private getMappingsData(): any {
    const mappingsJson = fs.readFileSync(this.mappingsPath, "utf8");
    return JSON.parse(mappingsJson);
  }

  public async createIndex() {
    const checkIndex = await this.elasticsearchService.indices.exists({
      index: this.index,
    });

    if (checkIndex.statusCode === 404) {
      const mappingsData = this.getMappingsData();

      try {
        await this.elasticsearchService.indices.create({
          index: this.index,
          body: mappingsData,
        });

        console.log(`Index '${this.index}' created successfully.`);
      } catch (error) {
        console.error(`Error creating index '${this.index}':`, error);
      }
    }
  }

  async indexPost(task: Task) {
    return this.elasticsearchService.index<TaskSearchResult, TaskSearchBody>({
      index: this.index,
      body: {
        id: task.id,
        title: task.title,
        description: task.description,
        user_id: task.user.id,
      },
    });
  }

  async search(text: string) {
    const { body } = await this.elasticsearchService.search<TaskSearchResult>({
      index: this.index,
      body: {
        query: {
          query_string: {
            query: text,
            fields: ["title", "description"],
          },
        },
        // query: {
        //   multi_match: {
        //     query: text,
        //     fields: ['title', 'description']
        //   }
        // }
      },
    });

    const hits = body.hits.hits;

    return hits.map((item) => item._source);
  }
}
