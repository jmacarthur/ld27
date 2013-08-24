#!/usr/bin/perl
use CGI;
use Data::Dumper;
use DBI;

open STDERR, ">>errors" if $ENV{SERVER_SOFTWARE} =~ m/^mini_httpd/;

my $dbh = DBI->connect("dbi:SQLite:../condition.sqlite","","");

my $sth = $dbh->prepare("INSERT INTO userids (shard) VALUES (0);");
my $rh = $sth->execute();
my $userID = $dbh->func('last_insert_rowid');
my $q = CGI->new;
print $q->header('text/plain');
print "USERID: $userID\n";

# I should also give you a shard ID. Either you find a shard with
# 2 people in it already, or you join a shard with not enough people,
# or make a new shard.

# Is there any shard with 2 people in it?
my $sth = $dbh->prepare("select shardid from shard where status=0 LIMIT 1;");
my $tuples = $sth->execute();
my $array = $sth->fetchrow_array();

if($array > 0) {
    print "You join exisiting shard $array[0]\n";
}
else
{
    my $sth = $dbh->prepare("INSERT INTO shard (status,playerx,playery,time) VALUES (0,64,64,0);");
    my $rh = $sth->execute();
    my $shardID = $dbh->func('last_insert_rowid');
    print "You join new shard $shardID\n";
}
