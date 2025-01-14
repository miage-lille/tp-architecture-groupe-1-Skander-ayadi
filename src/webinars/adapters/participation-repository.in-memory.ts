import { IWebinarRepository } from '../ports/webinar-repository.interface';
import { Webinar } from '../entities/webinar.entity';
import { IParticipationRepository } from '../ports/participation-repository.interface';
import { Participation } from '../entities/participation.entity';

export class InMemoryParticipationRepository implements IParticipationRepository {

  constructor(public database: Participation[] = []) {}

  async findByWebinarId(webinarId: string): Promise<Participation[]> {
    this.database.filter((participation) => participation.props.webinarId === webinarId);
  }

  async save(participation: Participation): Promise<void> {
    this.database.push(participation);
  }

}