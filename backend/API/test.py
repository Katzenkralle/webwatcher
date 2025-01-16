import strawberry
from strawberry.fastapi import GraphQLRouter

 

@strawberry.type
class Query:
    @strawberry.field
    async def test(self) -> str:
        return "Hello, World!"


schema = strawberry.Schema(query=Query)
router = GraphQLRouter(schema=schema)
