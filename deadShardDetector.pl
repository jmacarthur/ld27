#!/usr/bin/perl
use CGI;
use Data::Dumper;
use DBI;

my $dbh = DBI->connect("dbi:SQLite:condition.sqlite","","");

while(1) {

    my $sth = $dbh->prepare("SELECT shardid,lastused FROM shard WHERE inuse=1 AND lastused<(datetime('now','-60 seconds'));");
    my $rh = $sth->execute();
    
    while(@array = $sth->fetchrow_array()) {
        print "ShardID $array[0] appears to be dead (last seen $array[1])\n";
        $sth=$dbh->prepare("UPDATE shard SET inuse=0 WHERE shardID=?");
        $sth->execute($array[0]);
        print "It has been set to not in use\n";
    }

    sleep(30);
}

