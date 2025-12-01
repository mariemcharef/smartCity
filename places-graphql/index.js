const { ApolloServer, gql } = require('apollo-server');
const { v4: uuidv4 } = require('uuid');

const typeDefs = gql`
  enum PlaceType {
    cafe
    park
    hospital
    restaurant
    museum
    shop
  }

  enum ZoneType {
    Centre
    Lac
    Nord
    Sud
    Ouest
    Est
  }

  type Place { 
    id: ID!,
    name: String!, 
    type: PlaceType!, 
    zone: ZoneType! 
  }

  input PlaceInput {
    name: String!
    type: PlaceType!
    zone: ZoneType!
  }

  type Query {
    places(
      zone: ZoneType, 
      type: PlaceType, 
      search: String,
      sortBy: String,
      page: Int,
      limit: Int
    ): [Place]

    place(id: ID!): Place
  }

  type Mutation {
    createPlace(data: PlaceInput!): Place
    updatePlace(id: ID!, data: PlaceInput!): Place
    deletePlace(id: ID!): Boolean
  }
`;

// Sample in-memory data
let sample = [
  { id: "1", name: "Cafe Bleu", type: "cafe", zone: "Centre" },
  { id: "2", name: "Grand Park", type: "park", zone: "Lac" },
  { id: "3", name: "City Hospital", type: "hospital", zone: "Centre" }
];

const resolvers = {
  Query: {
    places: (_, args) => {
      let result = [...sample];

      // Filtering
      if (args.zone) {
        result = result.filter(p => p.zone === args.zone);
      }
      if (args.type) {
        result = result.filter(p => p.type === args.type);
      }
      if (args.search) {
        const s = args.search.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(s));
      }

      // Sorting
      if (args.sortBy) {
        const key = args.sortBy;
        if (!["name", "type", "zone"].includes(key))
          throw new Error("Invalid sort field");
        result.sort((a, b) => a[key].localeCompare(b[key]));
      }

      // Pagination
      const page = args.page || 1;
      const limit = args.limit || result.length;
      const start = (page - 1) * limit;
      const end = start + limit;

      return result.slice(start, end);
    },

    place: (_, { id }) => sample.find(p => p.id === id)
  },

  Mutation: {
    createPlace: (_, { data }) => {
      if (!data.name.trim())
        throw new Error("Name cannot be empty");

      const newPlace = {
        id: uuidv4(),
        ...data
      };

      sample.push(newPlace);
      return newPlace;
    },

    updatePlace: (_, { id, data }) => {
      const index = sample.findIndex(p => p.id === id);
      if (index === -1) throw new Error("Place not found");

      // Merge old & new
      sample[index] = {
        ...sample[index],
        ...data
      };

      return sample[index];
    },

    deletePlace: (_, { id }) => {
      const index = sample.findIndex(p => p.id === id);
      if (index === -1) return false;

      sample.splice(index, 1);
      return true;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 3002 }).then(({ url }) => {
  console.log(`🚀 GraphQL running at ${url}`);
});
