import humanize from 'humanize-duration';

export default ({duration, round}) => humanize(duration, {round})