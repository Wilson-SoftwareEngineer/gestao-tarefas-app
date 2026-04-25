package com.aprendendo.gestaotarefas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class GestaoTarefasApplication {

	public static void main(String[] args) {
		SpringApplication.run(GestaoTarefasApplication.class, args);
	}

}
