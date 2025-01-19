import { Email, IMailer } from 'src/core/ports/mailer.interface';
import { Executable } from 'src/shared/executable';
import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';
import { Participation } from '../entities/participation.entity';
import { WebinarDatesTooSoonException } from '../exceptions/webinar-dates-too-soon';
import { WebinarNotEnoughSeatsException } from '../exceptions/webinar-not-enough-seats';
import { UserAlreadyParticipatingToWebinar } from '../exceptions/user-already-participating-to-webinar';
import { WebinarTooManySeatsException } from '../exceptions/webinar-too-many-seats';

type Request = {
  webinarId: string;
  user: User;
};
type Response = void;

export class BookSeat implements Executable<Request, Response> {

  constructor(
    private readonly participationRepository: IParticipationRepository,
    private readonly userRepository: IUserRepository,
    private readonly webinarRepository: IWebinarRepository,
    private readonly mailer: IMailer,
  ) {
  }

  async execute({ webinarId, user }: Request): Promise<Response> {

    const userId = user.props.id;

    if(!userId) {
      throw new Error('User not found');
    }

    const webinar = await this.webinarRepository.findById(webinarId);

    if(!webinar) {
      throw new Error('Webinar not found');
    }
    
    if (webinar.hasNotEnoughSeats()) {
      throw new WebinarNotEnoughSeatsException();
    }


    const participationExists = await this.participationRepository.findByWebinarId(webinarId);

    if (participationExists.some(participation => participation.props.userId === userId)) {
      throw new UserAlreadyParticipatingToWebinar();
    }

    const participation = new Participation({ userId, webinarId });

    await this.participationRepository.save(participation);

    const organizer = await this.userRepository.findById(
      webinar.props.organizerId,
    );

    if(!organizer) {
      throw new Error('Organizer not found');
    }

    const email: Email = {
      to: organizer.props.email,
      subject: 'New participant',
      body: `A new participant has booked a seat for your webinar ${webinar.props.title}.`,
    };

    await this.mailer.send(email);

    return;
  }


}
