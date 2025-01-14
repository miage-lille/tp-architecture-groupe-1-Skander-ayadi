import { InMemoryWebinarRepository } from '../adapters/webinar-repository.in-memory';
import { BookSeat } from './book-seat';
import { InMemoryMailer } from '../../core/adapters/in-memory-mailer';
import { InMemoryParticipationRepository } from '../adapters/participation-repository.in-memory';
import { InMemoryUserRepository } from '../../users/adapters/InMemoryUserRepository';
import { User } from '../../users/entities/user.entity';
import { Webinar } from '../entities/webinar.entity';
import { Participation } from '../entities/participation.entity';
import { WebinarNotEnoughSeatsException } from '../exceptions/webinar-not-enough-seats';
import { UserAlreadyParticipatingToWebinar } from '../exceptions/user-already-participating-to-webinar';
import { OrganizeWebinars } from './organize-webinar';
import { IIdGenerator } from '../../core/ports/id-generator.interface';
import { IDateGenerator } from '../../core/ports/date-generator.interface';



describe('Feature : Book a Seat in a webinar', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let participationRepository: InMemoryParticipationRepository;
  let userRepository: InMemoryUserRepository;
  let mailer: InMemoryMailer;
  let useCase: BookSeat;
  let idGenerator: IIdGenerator;
  let organizeWebinars: OrganizeWebinars;
  let dateGenerator: IDateGenerator;

  const payload = {
    webinarId: 'webinar-1',
    user: new User({ id: 'user-1', email: 'email@gmail.com', password: 'password' }),
  }

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository();
    participationRepository = new InMemoryParticipationRepository();
    userRepository = new InMemoryUserRepository();
    mailer = new InMemoryMailer();
    useCase = new BookSeat(participationRepository, userRepository, webinarRepository, mailer);
  });


  it('should book a seat successfully', async () => {
    const user = new User({ id: 'user-1', email: 'user1@example.com', password: 'password' });
    const webinar = new Webinar({ id: 'webinar-1', organizerId: 'organizer-1', title: 'Webinar 1', startDate: new Date('2024-01-10T10:00:00.000Z'), endDate: new Date('2024-01-10T11:00:00.000Z'), seats: 100 });
    userRepository.database.push(user);
    webinarRepository.database.push(webinar);

    await useCase.execute(payload);

    expect(participationRepository.database).toHaveLength(1);
    expect(participationRepository.database[0]).toEqual(new Participation({ userId: 'user-1', webinarId: 'webinar-1' }));
  });

  it('should throw an error if webinar has not enough seats', async () => {
    const user = new User({ id: 'user-1', email: 'user1@example.com', password: 'password' });
    const webinar = new Webinar({ id: 'webinar-1', organizerId: 'organizer-1', title: 'Webinar 1', startDate: new Date('2024-01-10T10:00:00.000Z'), endDate: new Date('2024-01-10T11:00:00.000Z'), seats: 0 });
    userRepository.database.push(user);
    webinarRepository.database.push(webinar);

    await expect(useCase.execute(payload)).rejects.toThrow(WebinarNotEnoughSeatsException);
  });


  it('should throw an error if user is already participating', async () => {
    const user = new User({ id: 'user-1', email: 'user1@example.com', password: 'password' });
    const webinar = new Webinar({ id: 'webinar-1', organizerId: 'organizer-1', title: 'Webinar 1', startDate: new Date('2024-01-10T10:00:00.000Z'), endDate: new Date('2024-01-10T11:00:00.000Z'), seats: 100 });
    const participation = new Participation({ userId: 'user-1', webinarId: 'webinar-1' });
    userRepository.database.push(user);
    webinarRepository.database.push(webinar);
    participationRepository.database.push(participation);

    await expect(useCase.execute(payload)).rejects.toThrow(UserAlreadyParticipatingToWebinar);
  });

})

describe('Feature : Send a mail to the webinar organizer', () => {

  let webinarRepository: InMemoryWebinarRepository;
  let participationRepository: InMemoryParticipationRepository;
  let userRepository: InMemoryUserRepository;
  let mailer: InMemoryMailer;
  let useCase: BookSeat;

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository();
    participationRepository = new InMemoryParticipationRepository();
    userRepository = new InMemoryUserRepository();
    mailer = new InMemoryMailer();
    useCase = new BookSeat(participationRepository, userRepository, webinarRepository, mailer);
  });

  it('should send a mail to the webinar organizer', async () => {
    const user = new User({ id: 'user-1', email: 'email', password: 'password' });
    const organizer = new User({ id: 'organizer-1', email: 'email', password: 'password' });
    const webinar = new Webinar({
      id: 'webinar-1',
      organizerId: 'organizer-1',
      title: 'Webinar 1',
      startDate: new Date('2024-01-10T10:00:00.000Z'),
      endDate: new Date('2024-01-10T11:00:00.000Z'),
      seats: 100
    });
    userRepository.database.push(user);
    userRepository.database.push(organizer);
    webinarRepository.database.push(webinar);

    await useCase.execute({ webinarId: 'webinar-1', user });

    expect(mailer.sentEmails).toHaveLength(1);
    expect(mailer.sentEmails[0]).toEqual({
      to: 'email',
      subject: 'New participant',
      body: 'A new participant has booked a seat for your webinar Webinar 1.'
    });

  });

});