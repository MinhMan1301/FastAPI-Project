from urllib import response

from fastapi import FastAPI, Query, Path, HTTPException, status, Body, Request
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

from starlette.responses import HTMLResponse

from database import cars
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

templates = Jinja2Templates(directory="templates")

class Car(BaseModel):
    make : str
    model : str
    year : int = Field(..., ge = 1970, lt = 2022 )
    price : float
    engine : Optional[str] = "V4"
    sold : List[str]
    autonomous : bool
    sold : Optional[List[str]]



app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get(path="/", response_class=HTMLResponse)
def root(request: Request):
    return templates.TemplateResponse(request, name="home.html")

@app.get("/cars", response_model = List[Dict[str,Car]])
def get_cars(number : Optional[str] = Query("10", max_length = 3)):
    response = []
    for id, car in list(cars.items())[:int(number)]:
        to_add = {}
        to_add[str(id)] = car
        response.append(to_add)
    return response

@app.get("/cars/{id}", response_model = Car)
def get_car_by_id(id: int = Path(...,ge = 0, lt = 1000)):
    car = cars.get(id)
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="could not find car by id")
    return car

@app.post("/cars", status_code = status.HTTP_201_CREATED)
def add_car(body_cars : List[Car], min_id : Optional[int] = Body(0)):
    if len(cars) < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="could not find car")
    min_id = len(cars.values()) + min_id
    for car in body_cars:
        while cars.get(min_id):
            min_id += 1
        cars[min_id] = car
        min_id += 1


@app.put("/cars/{id}", response_model=Dict[str, Car])
def update_car(id: int, car: Car = Body(...)):
    stored = cars.get(id)
    if not stored:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Could not find car with given id")

    stored = Car(**stored)
    new = car.dict(exclude_unset=True)
    new = stored.copy(update=new)
    cars[id] = jsonable_encoder(new)

    response = {}
    response[str(id)] = cars[id]
    return response

@app.delete("/cars/{id}")
def delete_car(id: int):
    if not cars.get(id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="could not find car with given id")
    else:
        del cars[id]


