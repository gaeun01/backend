const express = require('express'); //express 기본 라우팅
const app = express(); //express 기본 라우팅
const port = 9070;

const cors = require('cors'); //교차출처공유 허용하기 위함
const mysql = require('mysql');
const brcypt = require('bcrypt'); //비밀번호 암호화 라이브러리
const jwt = require('jsonwebtoken'); //토큰 생성을 위함
const SECRET_KET = 'test';

app.use(cors());
app.use(express.json()); //JSON 본문 파싱 미들웨어

//mysql변수 선언
const mysql = require('mysql'); 

//1. mysql 연결 정보 셋팅
const connection = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'1234',
  database:'kdt'
});

//2. MYSQL DB접속시 오류가 나면 에러 출력하기, 성공하면 '성공'표시하기
connection.connect((err)=>{
  if(err){
    console.log('MYSQL연결 실패 : ', err);
    return;
  }
  console.log('MYSQL연결 성공');
});

// 3. 로그인 폼에서 post 방식으로 전달 받은 데이터를 DB에 조회하여 결과값을 리턴함.
app.post('/login', (req,res)=>{
  const {username, password} = req.body;

  connection.query('SELECT * FROM users WHRERE username = ?', [username], async (err, results)=>{
    if(err||results.length===0){
      return res.status(400).json({error:'아이디 또는 비밀번호가 틀립니다.'});
    }
    
    const user = result[0];
    const isMatch = await brcypt.compare(password, user.password);

    if(!isMatch){
      return res.status(400).json({error:'아이디 또는 비밀번호가 틀립니다.'});
    }
    const token = jwt.sign({id:user.id, username:user.username}, SECRET_KEY,{expiresIn:'1h'});
      res.json({token});
  });
});

// 4. Register.js에서 넘겨 받은 username, password를 sql db에 입력하여 추가한다.
app.post('/register', async (req,res)=>{
  const {username, password} = req.body;
  const hash = await brcypt.hash(password, 10);

  connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], 
    (err) =>{
      if(err){
        if(err.code === 'ER_DUP_ENTRY'){
        return res.status(400).json({error: '이미 존재하는 아이디입니다.'});
      }
      return res.status(500).json({error: '회원가입 실패'});
    }
      res.json({success: true});
    }
  )
});

//방법1. db연결 테스트 - 메세지만 확인하기 위함
// app.get('/', (req,res)=>{
//   //특정 경로로 요청된 정보를 처리
//   res.json('Excused from Backend');
// });

//방법2. SQL쿼리문을 사용하여 DB에서 조회된 데이터를 출력한다.(Read)
//1. 상품목록 조회하기
//상품목록은 상품코드(g_code), 상품명(g_name), 상품가격(g_cost)으로 구성되어 있다.
app.get('/goods', (req,res)=>{
  connection.query("SELECT * FROM goods", (err, results)=>{
    if(err){
      console.log('쿼리문 오류 : ', err);
      res.status(500).json({error: 'DB쿼리 오류'});
      return;
    }
    res.json(results);
  })
});

//1. 상품목록 조회하기(fruits)
app.get('/fruits', (req, res) => {
  connection.query("SELECT * FROM fruit ORDER BY fruit.num DESC", (err,   results)=>{
    if(err){
      console.log('쿼리문 오류 : ', err);
      res.status(500).json({error: 'DB쿼리 오류'});
      return;
    }
    //json데이터로 결과를 저장
    res.json(results);
  })
});

//2. 상품삭제(DELETE)
//상품삭제는 상품코드(g_code)를 기준으로 삭제한다.
app.delete('/goods/:g_code', (req, res) => {
  const g_code = req.params.g_code;
  connection.query(
    'DELETE FROM goods WHERE g_code = ?',
    [g_code],
    (err, result) => {
      if (err) {
        console.log('삭제 오류:', err);
        res.status(500).json({ error: '상품 삭제 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//2. 상품삭제(fruit)
app.delete('/fruits/:num', (req, res) => {
  const num = req.params.num;
  connection.query(
    'DELETE FROM fruit where num=?', [num], (err, result) => {
      if(err){
        console.log('삭제 오류 : ', err);
        res.status(500).json({err : '상품 삭제 실패'});
        return;
      }
      res.json({success:true});
    }
  )
});

//3. 상품수정 (UPDATE)
//상품수정은 상품코드(g_code)를 기준으로 수정한다.
app.put('/goods/update/:g_code', (req, res)=>{
  const g_code = req.params.g_code;
  const {g_name, g_cost} = req.body;

  //update쿼리문 작성하여 실행
  connection.query(
    'UPDATE goods SET g_name = ?, g_cost= ? where g_code= ?', [g_name, g_cost, g_code],
    (err, result) => {
      if(err){
        console.log('수정 오류 : ', err);
        res.status(500).json({error : '상품 수정하기 실패'});
        return;
      }
      res.json({success:true});
    }
  );
});

//3. 상품수정 fruits(update)
app.put('/fruits/update/:num', (req, res)=>{
  const num = req.params.num;
  const { name, price, color, country } = req.body;

  // 필수값 체크
  if (!name || !price || !color || !country) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요.' });
  }

  connection.query(
    'UPDATE fruit SET name=?, price=?, color=?, country=? WHERE num=?',
    [name, price, color, country, num],
    (err, result) => {
      if (err) {
        console.log('수정 오류 : ', err);
        res.status(500).json({ error: '상품 수정하기 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//4. 특정상품 조회하기(UPDATE)
// 특정 상품 조회 (GET /goods/:g_code)
app.get('/goods/:g_code', (req, res) => {
  const g_code = req.params.g_code;

  connection.query(
    'SELECT * FROM goods WHERE g_code = ?',
    [g_code],
    (err, results) => {
      if (err) {
        console.log('조회 오류:', err);
        res.status(500).json({ error: '상품 조회 실패' });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ error: '해당 상품이 없습니다.' });
        return;
      }

      res.json(results[0]); // 단일 객체만 반환
    }
  );
});

//4. fruits 상품 조회하기 (SELECT)
app.get('/fruits/:num', (req, res) => {
  const num = req.params.num;

  connection.query(
    'SELECT * FROM fruit WHERE num = ?',
    [num],
    (err, results) => {
      if (err) {
        console.log('조회 오류:', err);
        res.status(500).json({ error: '상품 조회 실패' });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ error: '해당 상품이 없습니다.' });
        return;
      }

      res.json(results[0]); // 단일 객체만 반환
    }
  )
});





//서버실행
app.listen(port, ()=>{
  console.log('Listening...');
});


