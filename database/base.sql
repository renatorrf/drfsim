create table tab_usuario(
cod_usuario serial PRIMARY KEY NOT NULL,
usuario varchar(100) NOT NULL,
senha varchar(50) NOT NULL,
senha_transacao varchar(50)NOT NULL,
pix varchar(255) NOT NULL,
telefone varchar(20) NOT NULL,
email varchar(150) NOT NULL,
perfil integer not null
);

create table tab_investimento(
seq_investimento serial PRIMARY KEY NOT NULL,
val_investimento integer NOT NULL,
dta_investimento date NOT NULL,
ind_status char NOT NULL,
ind_prioridade INTEGER NOT NULL,
cod_usuario integer NOT NULL,
CONSTRAINT cod_usuario FOREIGN key (cod_usuario) references tab_usuario(cod_usuario)
);

create table tab_resgate(
seq_resgate serial PRIMARY KEY NOT NULL,
val_resgate integer NOT NULL,
data_resgate date NOT NULL,
ind_status char NOT NULL,
cod_usuario integer,
CONSTRAINT cod_usuario FOREIGN key (cod_usuario) references tab_usuario(cod_usuario)
);

create table tab_item(
cod_item serial PRIMARY KEY NOT NULL,
des_item varchar(255) NOT NULL,
detalhes_item varchar(255) NOT NULL,
ind_status char NOT NULL,
dta_inclusao date not null,
dta_venda date,
imagem_item_1 bytea,
imagem_item_2 bytea,
imagem_item_3 bytea,
imagem_item_4 bytea,
imagem_item_5 bytea,
imagem_item_6 bytea,
val_item integer NOT NULL,
val_venda INTEGER
);

create table tab_investimento_item(
seq_investimento_item serial PRIMARY KEY NOT NULL,
percentual_veiculo double PRECISION not null,
ind_apurado char not null,
dta_investimento date not null,
cod_usuario integer not null,
CONSTRAINT cod_usuario FOREIGN key (cod_usuario) references tab_usuario(cod_usuario),
cod_item integer NOT NULL,
CONSTRAINT cod_item FOREIGN key (cod_item) references tab_item(cod_item),
seq_investimento integer not null,
CONSTRAINT seq_investimento FOREIGN key (seq_investimento) references tab_investimento(seq_investimento)
);

create table tab_despesa_item(
seq_despesa serial PRIMARY KEY NOT NULL,
des_despesa varchar(255) not NULL,
val_despesa integer not null,
dta_despesa date not null,

cod_item integer NOT NULL,
CONSTRAINT cod_item FOREIGN key (cod_item) references tab_item(cod_item)
);

create table tab_compra_investimento(
seq_compra serial PRIMARY KEY NOT NULL,
val_compra integer not null,
seq_investimento integer not null,
CONSTRAINT seq_investimento FOREIGN key (seq_investimento) references tab_investimento(seq_investimento),
cod_usuario integer,
CONSTRAINT cod_usuario FOREIGN key (cod_usuario) references tab_usuario(cod_usuario)
)

create table tab_lucro_prejuizo(
seq_registro serial PRIMARY KEY NOT NULL,
valor_resultado double PRECISION not NULL,
dta_resultado date not NULL,
seq_investimento integer not null,
CONSTRAINT seq_investimento FOREIGN key (seq_investimento) references tab_investimento(seq_investimento),
cod_usuario integer,
CONSTRAINT cod_usuario FOREIGN key (cod_usuario) references tab_usuario(cod_usuario)
)