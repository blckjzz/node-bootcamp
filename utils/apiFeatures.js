class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let objQuery = { ...this.queryString };
    // console.log(`Inside filter function!: ${objQuery}`);
    const excludesFields = ['sort', 'page', 'limit', 'fields'];
    excludesFields.forEach((ex) => {
      delete objQuery[ex];
    });
    objQuery = JSON.stringify(objQuery).replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );
    // console.log(objQuery);
    this.query = this.query.find(JSON.parse(objQuery));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  fields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // (1-1)*3) -- page 1 = 0
    // (2-1)*3) -- page 2 = 3
    // (3-1)*3) -- page 2 = 6
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
