import * as helpers from '../helpers';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import * as SERVICE from './service';

import * as mongoose from 'mongoose';
import { Product, ProductSchema } from './models/product';
import { State, StateSchema } from './models/state';

import { AdvanceStateOrder } from './models/advance-state-order';

export class ProductRepository {

  private ProductModel;
  private StateModel;

  private advancing:boolean = false;

  constructor() {
    this.ProductModel = mongoose.model('Product', ProductSchema);
    this.StateModel = mongoose.model('State', StateSchema);
  }

  save(product:Product):Observable<Product[]> {
    return new Observable<Product[]>(obs=>{
      while(this.advancing){}
      const prod = new this.ProductModel();
      for(let key in product) {
        if(key!='id')
          prod[key] = product[key];
      }
      prod.save( (err, _prod) => {
        if(err!=null)
          helpers.cancelObs(obs);
        else
          helpers.okObs(obs, [<Product> _prod]);
      });
      return null;
    });
  }

  update(product:Product):Observable<Product[]> {
    return new Observable<Product[]>(obs=>{
      while(this.advancing){}
      this.ProductModel.findById(product.id, (err, prod) => {  
        if(err!=null)
          helpers.cancelObs(obs);
        else {
          if(prod==null)
            helpers.failObs(obs);
          else {
            for(let key in product) {
              if(key!='id')
                prod[key] = product[key];
            }
            // Save the updated document back to the database
            prod.save( (err, _prod) => {
              if(err!=null)
                helpers.cancelObs(obs);
              else
                helpers.okObs(obs, [<Product> _prod]);
            });
          }
        }
      });
      return null;
    });
  }

  delete(id:string):Observable<Product[]> {
    return new Observable<Product[]>(obs=>{
      while(this.advancing){}
      this.ProductModel.findByIdAndRemove(id, (err, prod) => {  
        if(err!=null)
          helpers.cancelObs(obs);
        else{
          if(prod==null)
            helpers.failObs(obs);
          else
            helpers.okObs(obs);
        }
      });
      return null;
    });
  }

  get(id:string):Observable<Product[]> {
    return new Observable<Product[]>(obs=>{
      while(this.advancing){}
      this.ProductModel.findById(id, (err, prod) => {  
        if(err!=null)
          helpers.cancelObs(obs);
        else
          helpers.okObs(obs, [<Product> prod]);
      });
      return null;
    });
  }

  find(info:any = null):Observable<Product[]> {
    return new Observable<Product[]>(obs=>{
      while(this.advancing){}
      if(info==null)
        this.findAll(obs);
      else {
        if(info.hasOwnProperty('query'))
          this.findQuery(info.query, obs);
        else
          this.findAll(obs);
      }
      return null;
    });
  }

  findAll(obs) {
    this.ProductModel.find( (err, prods) => {  
      if(err)
        helpers.cancelObs(obs);
      else 
        helpers.okObs(obs, prods.map(prod => <Product> prod));
    });
  }

  findQuery(query, obs) {
    this.ProductModel.find(query, (err, prods) => {  
      if(err!=null)
        helpers.cancelObs(obs);
      else
        helpers.okObs(obs, prods.map(prod => <Product> prod));
    }); 
  }

  getState():Observable<State[]> {
    return new Observable<State[]>(obs=>{
      while(this.advancing){}
      this.StateModel.find({name:SERVICE.STATE}, (err, state) => {
        if(err!=null)
          helpers.failObs(obs);
        else {
          if(state.length==0) {
            this.startState();
            helpers.failObs(obs);
          } else
            helpers.okObs(obs, [<State>state[0]]);
        }
      });
      return null;
    });
  }

  advance(order:AdvanceStateOrder):Observable<State[]> {
    if(this.advancing)
      return new Observable<State[]>(obs=>helpers.failObs(obs));
    this.advancing = true;
    return new Observable<State[]>(obs=>{
      this.StateModel.find({name:SERVICE.STATE}, (err, state) => {
        if(err!=null)
          helpers.failObs(obs);
        else {
          if(state.length==0) {
            this.startState();
            this.advancing = false;
            helpers.failObs(obs);
          } else
            this.proceedAdvance(obs, state[0], order);
        }
      });
      return null;
    });
  }

  proceedAdvance(obs, state, order) {
    Observable.forkJoin( order.commands.map(command=>{
      return SERVICE.operate(command, new ProductRepository());
    })).subscribe(results=>{
      let success = true;
      results.forEach(res=>{
        if(!helpers.isOk(res))
          success = false;
      });
      if(success)
        this.finalizeAdvance(obs, state);
      else {
        console.log("FATAL ERROR! SOME QUERYES FAILED IN STATE CHANGING");
        helpers.failObs(obs);
      }
    });
  }

  finalizeAdvance(obs, state) {
    state.version++;
    state.save((err, _state) => {
      if(err!=null){
        console.log("FATAL ERROR! YOU CAN FIX IT MANUALLY ADVANCING STATE VERSION");
        helpers.failObs(obs);
      } else {
        this.advancing = false;
        helpers.okObs(obs, [<State> _state]);
      }
    });
  }

  startState() {
    console.log('Starting State Zero');
    mongoose.connection.db.dropDatabase((err)=>{
      if(err==null) {
        console.log('Old DB Erased');
        const state = new this.StateModel();
        state.name = SERVICE.STATE;
        state.version = 0;
        state.save((err)=>{
          if(err==null)
            console.log('State Restarted to Zero!');
          else
            console.log(err);
        });
      } else
        console.log(err);
    });
  }

}