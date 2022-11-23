package edu.iu.uits.lms.bulkremoveusers.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.persistence.EntityManagerFactory;
import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration("bulkRemoveUsersDbConfig")
@EnableJpaRepositories(
        entityManagerFactoryRef = "bulkRemoveUsersEntityMgrFactory",
        transactionManagerRef = "bulkRemoveUsersTransactionMgr",
        basePackages = {"edu.iu.uits.lms.bulkremoveusers.repository"})
@EnableTransactionManagement
public class PostgresDBConfig {

    @Primary
    @Bean(name = "bulkRemoveUsersDataSource")
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }

    @Bean(name = "bulkRemoveUsersEntityMgrFactory")
    @Primary
    public LocalContainerEntityManagerFactoryBean bulkRemoveUsersEntityMgrFactory(
            final EntityManagerFactoryBuilder builder,
            @Qualifier("bulkRemoveUsersDataSource") final DataSource dataSource) {
        // dynamically setting up the hibernate properties for each of the datasource.
        final Map<String, String> properties = new HashMap<>();
        return builder
                .dataSource(dataSource)
                .properties(properties)
                .packages("edu.iu.uits.lms.bulkremoveusers.model")
                .build();
    }

    @Bean(name = "bulkRemoveUsersTransactionMgr")
    @Primary
    public PlatformTransactionManager bulkRemoveUsersTransactionMgr(
            @Qualifier("bulkRemoveUsersEntityMgrFactory") final EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
