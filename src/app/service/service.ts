import { Command } from '../models/command';
import { ProductRepository } from './product-repository';

export const NAME = 'Product Repository';
export const STATE = 'PdStV1';

export const CHANNEL = {
	IN:'get_repo_product',
	OUT:'got_repo_product',
};

export const COMMAND = {
  SAVE:"[Save]",
  UPDATE:"[Update]",
  GET:"[Get]",
  DELETE:"[Delete]",
  FIND:"[Find]",
  GET_STATE:"[Get State]",
  ADVANCE_STATE:"[Advance State]"
};

export const Service = ProductRepository;

export const operate = (cmd:Command, sv) => {
  switch (cmd.type) {

    case COMMAND.SAVE:
      return sv.save(cmd.payload);

    case COMMAND.UPDATE:
      return sv.update(cmd.payload);
    
    case COMMAND.GET:
      return sv.get(cmd.payload);
    
    case COMMAND.DELETE:
      return sv.delete(cmd.payload);

    case COMMAND.FIND:
      return sv.find(cmd.payload);

    case COMMAND.GET_STATE:
      return sv.getState();
    
    case COMMAND.ADVANCE_STATE:
      return sv.advance(cmd.payload);
    
    default:
      return null;
  }
};