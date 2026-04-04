import psycopg2


def get_connection():
    connection = psycopg2.connect(
        "postgresql://postgres:postgres@localhost:5433/course_forum"
    )
    return connection