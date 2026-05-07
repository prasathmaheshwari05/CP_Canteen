from pydantic import BaseModel


class StatusCreate(BaseModel):
    status_name: str
    type: str


class StatusResponse(BaseModel):
    id: int
    status_name: str
    type: str

    class Config:
        from_attributes = True
