import {Injectable, Logger, NotFoundException} from '@nestjs/common';
import {TaskStatus} from './task-status.enum';
import {CreateTaskDto} from './dto/create-task.dto';
import {GetTasksFilterDto} from './dto/get-tasks-filter.dto';
import {TasksRepository} from './tasks.repository';
import {InjectRepository} from '@nestjs/typeorm';
import {Task} from './task.entity';
import {User} from 'src/users/user.entity';
import { In } from 'typeorm';
import SearchService from 'src/search/search.service';

@Injectable()
export class TasksService {
    private logger = new Logger('TasksService');

    constructor(
        @InjectRepository(TasksRepository)
        private tasksRepository: TasksRepository,
        private tasksSearchService: SearchService
    ) {
    }

    // getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    //   return this.tasksRepository.getTasks(filterDto, user);
    // }
    async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
        const tasks = await this.tasksRepository.getTasks(filterDto, user);
        return tasks;
    }

    async getAllTasks(): Promise<Task[]> {
        return this.tasksRepository.getAllTasks();
    }


    async getTaskById(id: string, user: User): Promise<Task> {
        const found = await this.tasksRepository.findOne({where: {id, user}});

        if (!found) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }

        return found;
    }

    async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
        const newTask = await this.tasksRepository.createTask(createTaskDto, user);

        await this.tasksSearchService.indexPost(newTask);

        return newTask
    }

    async searchTasks(text: string) {
        const results = await this.tasksSearchService.search(text);
        const ids = results.map(result => result.id);

        if (!ids.length) {
            return [];
        }

        return this.tasksRepository
            .find({
                where: { id: In(ids) }
            });
    }

    async deleteTask(id: string, user: User): Promise<void> {
        const result = await this.tasksRepository.delete({id, user});

        if (result.affected === 0) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }
    }

    async updateTaskStatus(
        id: string,
        status: TaskStatus,
        user: User,
    ): Promise<Task> {
        const task = await this.getTaskById(id, user);

        task.status = status;
        await this.tasksRepository.save(task);

        return task;
    }

    //TODO delete this method?
    /*
      async getPhotoInfo(photoId: number): Promise<{ url: string }> {
        const photoInfo =

        if (!photoInfo) {
          this.logger.error(`Photo with ID ${photoId} not found.`);
          throw new NotFoundException(`Photo with ID ${photoId} not found.`);
        }
        return { url: photoInfo.url };
      }
    */


}

function uuid() {
    throw new Error('Function not implemented.');
}

