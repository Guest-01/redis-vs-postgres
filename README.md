# redis-vs-postgres

> in-memory 스토리지인 Redis가 정말 일반 RDB보다 빠른지 확인해보기 위한 벤치마크 코드

## 마주한 문제들

🚧1) docker로 생성한 postgres 컨테이너에서 psql로 DB 테이블을 생성하면 바로 없어져버리는 증상이 있음.

컨테이너를 생성할 때 몇가지 환경 변수를 누락하면 그럴 수 있는 듯. [출처](https://stackoverflow.com/questions/48629799/postgres-image-is-not-creating-database) 이때 초기에 누락하고 나면 아무리 다시 컨테이너를 다시 띄워도 해결되지 않는다. 그럴땐 `docker volume prune`을 통해 볼륨을 지워주고 다시 생성하면 된다고 함.

🚧2) `node-redis`는 Auto-Pipelining이 되어있어서 Prmoise로 여러 `set` 메소드를 호출하면 알아서 최적화가 된다. 하지만 `pg`의 경우는 알아서 최적화되는 것이 없기 때문에 가장 효율적인 쿼리를 찾아야 공평하게 벤치마킹을 할 수 있었다.

처음에는 `INSERT`문을 여러개 만들어놓고 `Promise.all`하였는데, 이렇게 하니까 엄청 오래 걸려서 다시 이번에는 하나의 `INSERT`문에 `VALUES` 값을 여러가 넣어서 시도하니 훨씬 빨라짐. 이때 `VALUES`에 여러 값을 넣기 위해서 `pg-format`이라는 패키지를 이용했음.

---

여기서 `v1` 완성. 결과는 Redis가 쓰기는 2배정도 빨랐고, 읽기는 Postgres가 2배정도 빨랐다.

그러나 실사용 환경에서는 단일 요청자가 이렇게 여러번 호출하는 것이 아니라, 여러 흩어진 사용자들이 요청을 날리기 때문에 Pipelining이나 단일 쿼리로 처리할 수 없을 것이다. 좀 더 실사용 환경에 맞는 `v2`를 만들어서 벤치마크를 해봐야 한다.
