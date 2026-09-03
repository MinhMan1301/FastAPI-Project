from pydantic import BaseModel
from typing import Dict, List, Optional

#All comment of one post
class Comment(BaseModel):
    author  : str
    comment : str
    likes   : int

#Post
class Post(BaseModel):
    author    : str
    co_author : Optional[str] = None
    date      : str
    title     : str
    content   : str
    id        : int
    likes     : List[str]
    comments : List[Comment]

#data
comments =[ Comment(author = "Minh" , comment ="It's nice to meet you", likes = 4384),
            Comment(author = "Quang", comment ="Glad to here it"      , likes = 43  ),
            Comment(author = "Jane" , comment = "Congratualations"    , likes = 3   ),
            ]

post1 = Post(author ="Max",co_author = None, date = "12-05-2009",title = "Application of Machine Learning",
             content = "This includes....", id = 3107, likes = ["Minh","Quang","Jane"],comments = comments)

#Access data
print(post1.comments[1].author)