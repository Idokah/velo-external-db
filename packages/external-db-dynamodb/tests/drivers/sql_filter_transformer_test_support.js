const { EMPTY_SORT } = require('velo-external-db-commons')
const { when } = require('jest-when')

const filterParser = {
    transform: jest.fn(),
    parseFilter: jest.fn(),
    orderBy: jest.fn(),
    parseAggregation: jest.fn(),
    selectFieldsFor: jest.fn(),
}

const stubEmptyFilterAndSortFor = (filter, sort) => {
    stubEmptyFilterFor(filter)
    stubEmptyOrderByFor(sort)
}

const stubEmptyFilterFor = (filter) => {
    when(filterParser.transform).calledWith(filter)
                                .mockReturnValue({ filterExpr: '', queryable: false })
}

const stubEmptyOrderByFor = (sort) => {
    when(filterParser.orderBy).calledWith(sort)
                              .mockReturnValue(EMPTY_SORT)
}

const givenFilterByIdWith = (id, filter) => {
    when(filterParser.transform).calledWith(filter)
                                .mockReturnValue({ filterExpr: {
                                    KeyConditionExpression: '#_id = :_id',
                                    ExpressionAttributeNames: {
                                        '#_id': '_id'
                                    },
                                    ExpressionAttributeValues: {
                                        ':_id': id
                                    }
                                }, queryable: true
                            })
}

const givenAllFieldsProjectionFor = (projection) => 
    when(filterParser.selectFieldsFor).calledWith(projection)
                                      .mockReturnValue(
                                          {
                                              projectionExpr: '',
                                              projectionAttributeNames: {}
                                          }
                                      )

const givenProjectionExprFor = (projection) => 
    when(filterParser.selectFieldsFor).calledWith(projection)
                                      .mockReturnValue(
                                            {
                                                projectionExpr: projection.map(f => `#${f}`).join(', '),
                                                projectionAttributeNames: projection.reduce((pV, cV) => (
                                                    { ...pV, [`#${cV}`]: cV }
                                                ), {})
                                            }
                                        )

// eslint-disable-next-line no-unused-vars
const givenAggregateQueryWith = (having, numericColumns, columnAliases, groupByColumns, filter) => {}

const reset = () => {
    filterParser.transform.mockClear()
    filterParser.orderBy.mockClear()
    filterParser.parseAggregation.mockClear()
    filterParser.parseFilter.mockClear()
    filterParser.selectFieldsFor.mockClear()
}

module.exports = { stubEmptyFilterAndSortFor, stubEmptyOrderByFor, stubEmptyFilterFor,
                   givenFilterByIdWith, filterParser, reset, givenAggregateQueryWith,
                   givenAllFieldsProjectionFor, givenProjectionExprFor
}