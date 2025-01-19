import { IWebinarRepository } from '../../webinars/ports/webinar-repository.interface';
import { IUserRepository } from '../ports/user-repository.interface';
import { User } from '../entities/user.entity';

export class InMemoryUserRepository implements IUserRepository {
  constructor(public database: User[] = []) {}

  async findById(id: string): Promise<User | undefined> {
    return this.database.find((user) => user.props.id === id);
  }
}