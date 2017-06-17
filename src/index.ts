import * as redis from 'redis';
import * as SERVICE from './app/service/service';
import { CommandHandler } from './app/command-handler';

import * as mongoose from 'mongoose';
import { Promise } from 'bluebird';

mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/repo_product');

const cmd = redis.createClient();
const handler = new CommandHandler();

cmd.on('message', function(channel, message) {
    //console.log("Received: ", message);
    handler.handle(message);
});

cmd.subscribe(SERVICE.CHANNEL.IN);

console.log('Started '+SERVICE.NAME+' service');